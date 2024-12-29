import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { ShoppingList } from '../shopping-list/entities/shopping-list.entity';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ActiveUserInterface } from '../common/interface/activeUserInterface';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
  ) {}

  private async classifyItem(name: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(
      'AIzaSyB5N-XIyR1NeDVOlpjkY5DrXhQqVzKXCCk',
    );
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Classify this item into a suitable category based on its name. Some common categories include: "Fruits", "Vegetables", "Dairy", "Beverages", "Electronics", "Clothing", "Home", "Others". If the item doesn't fit any of these categories, classify it into an appropriate category you consider suitable. Item: ${name}. Return only the name of the category without comments or additional text.`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }

  async createItemForShoppingList(
    shoppingList: ShoppingList,
    itemData: CreateItemDto,
  ): Promise<Item> {
    const category = await this.classifyItem(itemData.name);
    itemData.category = category;

    const item = this.itemRepository.create({
      ...itemData,
      shoppingList,
    });

    const savedItem = await this.itemRepository.save(item);
    shoppingList.items.push(savedItem);
    await this.itemRepository.save(shoppingList);

    return savedItem;
  }

  async findAllByShoppingList(shoppingListId: string): Promise<Item[]> {
    return this.itemRepository
      .createQueryBuilder('item')
      .where('item.shoppingListId = :shoppingListId', { shoppingListId })
      .getMany();
  }

  async deleteItem(id: string): Promise<void> {
    const item = await this.itemRepository.findOne({ where: { id } });

    if (!item) {
      throw new Error('Item not found');
    }

    await this.itemRepository.remove(item);
  }

  async updateItem(
    id: string,
    updateData: Partial<CreateItemDto>,
  ): Promise<Item> {
    const item = await this.itemRepository.findOne({ where: { id } });

    if (!item) {
      throw new Error('Item not found');
    }

    Object.assign(item, updateData);
    return this.itemRepository.save(item);
  }

  async getRecentItems(userActive: ActiveUserInterface): Promise<Item[]> {
    return this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.shoppingList', 'shoppingList')
      .leftJoinAndSelect('shoppingList.user', 'user')
      .where('user.id = :userId', { userId: userActive.id })
      .orderBy('item.createdAt', 'DESC')
      .limit(5)
      .getMany();
  }
}
