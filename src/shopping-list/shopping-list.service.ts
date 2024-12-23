import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActiveUserInterface } from 'src/common/interface/activeUserInterface';
import { ShoppingList } from './entities/shopping-list.entity';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { CreateItemDto } from 'src/item/dto/create-item.dto';
import { ItemService } from '../item/item.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Item } from 'src/item/entities/item.entity';

@Injectable()
export class ShoppingListService {
  constructor(
    @InjectRepository(ShoppingList)
    private shoppingListRepository: Repository<ShoppingList>,
    private itemService: ItemService,
  ) {}

  private async suggestItems(context: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(
      'AIzaSyB5N-XIyR1NeDVOlpjkY5DrXhQqVzKXCCk',
    );
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Sugiere una lista de 5 artículos para comprar según este contexto: 
      "${context}". 
      Devuélveme solo los nombres de los artículos como una cadena de texto, separados por comas.
    `;

    const result = await model.generateContent(prompt);
    const text = (await result.response.text()).trim();

    console.log(text);

    if (typeof text === 'string') {
      return text;
    } else {
      throw new Error(
        'La respuesta del modelo de IA no es un texto plano válido.',
      );
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

    const itemsContext = shoppingList.items.map((item) => item.name).join(', ');
    return this.suggestItems(itemsContext);
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
}
