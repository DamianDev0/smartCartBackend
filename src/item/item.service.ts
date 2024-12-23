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

    const prompt = `Clasifica este artículo en una categoría adecuada basándote en su nombre. Algunas categorías comunes incluyen: "Frutas", "Verduras", "Lácteos", "Bebidas", "Electrónicos", "Ropa", "Hogar", "Otros". Si el artículo no encaja en ninguna de estas categorías, clasifícalo en una categoría que consideres adecuada. Artículo: ${name}. Devuélveme solo el nombre de la categoría sin comentarios ni texto adicional.`;
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
