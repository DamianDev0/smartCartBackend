import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActiveUserInterface } from 'src/common/interface/activeUserInterface';
import { ShoppingList } from './entities/shopping-list.entity';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { CreateItemDto } from 'src/item/dto/create-item.dto';
import { ItemService } from '../item/item.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Item } from 'src/item/entities/item.entity';
import { ItemStatus } from 'src/common/enum/statusItem';

@Injectable()
export class ShoppingListService {
  constructor(
    @InjectRepository(ShoppingList)
    private shoppingListRepository: Repository<ShoppingList>,
    private itemService: ItemService,
  ) {}

  private async suggestItems(
    context: string,
    existingItems: Item[],
  ): Promise<string> {
    const genAI = new GoogleGenerativeAI(
      'AIzaSyB5N-XIyR1NeDVOlpjkY5DrXhQqVzKXCCk',
    );
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Suggest a list of 5 items to buy according to this context: 
      "${context}". 
      Return only the names of the items as a string, separated by commas. The items should be unique and should not include the following items: ${existingItems
        .map((item) => item.name)
        .join(', ')}
    `;

    const result = await model.generateContent(prompt);
    const text = (await result.response.text()).trim();

    if (typeof text === 'string') {
      let items = text.split(',').map((item) => item.trim());
      items = items.filter(
        (item) =>
          !existingItems.some((existingItem) => existingItem.name === item),
      );
      return items.join(', ');
    } else {
      throw new Error('The AI model response is not valid plain text.');
    }
  }

  async createShoppingList(
    createShoppingListDto: CreateShoppingListDto,
    userActive: ActiveUserInterface,
  ): Promise<ShoppingList> {
    const shoppingList = this.shoppingListRepository.create({
      ...createShoppingListDto,
      user: { id: userActive.id },
    });

    return await this.shoppingListRepository.save(shoppingList);
  }

  async findShoppingListById(
    id: string,
    userActive: ActiveUserInterface,
  ): Promise<ShoppingList> {
    const shoppingList = await this.shoppingListRepository.findOne({
      where: { id, user: { id: userActive.id } },
      relations: ['items'],
    });

    if (!shoppingList) {
      throw new Error('Shopping list not found or user is not authorized.');
    }

    return shoppingList;
  }

  async addItemToShoppingList(
    shoppingListId: string,
    itemData: CreateItemDto,
    userActive: ActiveUserInterface,
  ): Promise<any> {
    const shoppingList = await this.findShoppingListById(
      shoppingListId,
      userActive,
    );

    return this.itemService.createItemForShoppingList(shoppingList, itemData);
  }

  async getAllShoppingLists(
    userActive: ActiveUserInterface,
  ): Promise<ShoppingList[]> {
    return this.shoppingListRepository.find({
      where: { user: { id: userActive.id } },
      relations: ['items'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getShoppingListNamesAndIds(
    userActive: ActiveUserInterface,
  ): Promise<{ id: string; name: string }[]> {
    return this.shoppingListRepository.find({
      where: { user: { id: userActive.id } },
      select: ['id', 'name'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async suggestItemsForShoppingList(
    shoppingListId: string,
    userActive: ActiveUserInterface,
  ): Promise<string> {
    const shoppingList = await this.findShoppingListById(
      shoppingListId,
      userActive,
    );

    return this.suggestItems(shoppingList.context, shoppingList.items);
  }
  async deleteShoppingList(
    shoppingListId: string,
    userActive: ActiveUserInterface,
  ): Promise<void> {
    const shoppingList = await this.shoppingListRepository.findOne({
      where: { id: shoppingListId },
      relations: ['user'],
    });

    if (!shoppingList || shoppingList.user?.id !== userActive.id) {
      console.error('Forbidden: User does not own the shopping list');
      throw new ForbiddenException();
    }

    await this.shoppingListRepository.delete(shoppingListId);
  }

  async getRecentItems(userActive: ActiveUserInterface): Promise<Item[]> {
    return this.itemService.getRecentItems(userActive);
  }

  async getItemsByShoppingList(
    shoppingListId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userActive: ActiveUserInterface,
  ): Promise<Item[]> {
    return this.itemService.findAllByShoppingList(shoppingListId);
  }

  async getItemStatisticsForAllLists(
    userActive: ActiveUserInterface,
  ): Promise<{ pending: number; purchased: number }> {
    const result = await this.shoppingListRepository
      .createQueryBuilder('shoppingList')
      .innerJoin('shoppingList.items', 'item')
      .select([
        `SUM(CASE WHEN item.status = :pending THEN 1 ELSE 0 END) AS pending`,
        `SUM(CASE WHEN item.status = :purchased THEN 1 ELSE 0 END) AS purchased`,
      ])
      .where('shoppingList.user_id = :userId', { userId: userActive.id })
      .setParameters({
        pending: ItemStatus.PENDING,
        purchased: ItemStatus.PURCHASED,
      })
      .getRawOne();

    return {
      pending: parseInt(result.pending || '0', 10),
      purchased: parseInt(result.purchased || '0', 10),
    };
  }
  async getItemsByDay(
    userActive: ActiveUserInterface,
  ): Promise<{ date: string; status: string; count: number }[]> {
    const result = await this.shoppingListRepository
      .createQueryBuilder('shoppingList')
      .innerJoin('shoppingList.items', 'item')
      .select([
        `DATE(item.createdAt) AS date`,
        `item.status AS status`,
        `COUNT(item.id) AS count`,
      ])
      .where('shoppingList.user_id = :userId', { userId: userActive.id })
      .andWhere('item.status IN (:...statuses)', {
        statuses: [ItemStatus.PENDING, ItemStatus.PURCHASED],
      })
      .groupBy('DATE(item.createdAt), item.status')
      .orderBy('DATE(item.createdAt)', 'ASC')
      .addOrderBy('item.status', 'ASC')
      .getRawMany();

    return result.map((row) => ({
      date: row.date,
      status: row.status,
      count: parseInt(row.count, 10),
    }));
  }
}
