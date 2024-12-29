import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ShoppingListService } from './shopping-list.service';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { CreateItemDto } from '../item/dto/create-item.dto';
import { ActiveUserInterface } from '../common/interface/activeUserInterface';
import { AuthGuard } from '../auth/guard/auth.guard';
import { ActiveUser } from '../common/decorators/active-user.decorator';

@Controller('shopping')
@UseGuards(AuthGuard)
export class ShoppingListController {
  constructor(private readonly shoppingListService: ShoppingListService) {}

  @Post()
  async createShoppingList(
    @Body() createShoppingListDto: CreateShoppingListDto,
    @ActiveUser() userActive: ActiveUserInterface,
  ) {
    return await this.shoppingListService.createShoppingList(
      createShoppingListDto,
      userActive,
    );
  }

  @Get('statistics')
  async getStatisticsForAllLists(
    @ActiveUser() userActive: ActiveUserInterface,
  ) {
    return await this.shoppingListService.getItemStatisticsForAllLists(
      userActive,
    );
  }
  @Get()
  async getAllShoppingLists(@ActiveUser() userActive: ActiveUserInterface) {
    return await this.shoppingListService.getAllShoppingLists(userActive);
  }

  @Get('namesAndIds')
  async getNamesAndIds(@ActiveUser() userActive: ActiveUserInterface) {
    return await this.shoppingListService.getShoppingListNamesAndIds(
      userActive,
    );
  }

  @Get(':id')
  async findShoppingListById(
    @Param('id') id: string,
    @ActiveUser() userActive: ActiveUserInterface,
  ) {
    return await this.shoppingListService.findShoppingListById(id, userActive);
  }

  @Get('items/by-day')
  async getItemsByDay(@ActiveUser() userActive: ActiveUserInterface) {
    return await this.shoppingListService.getItemsByDay(userActive);
  }

  @Post(':id/items')
  async addItemToShoppingList(
    @Param('id') shoppingListId: string,
    @Body() itemData: CreateItemDto,
    @ActiveUser() userActive: ActiveUserInterface,
  ) {
    return await this.shoppingListService.addItemToShoppingList(
      shoppingListId,
      itemData,
      userActive,
    );
  }

  @Post(':id/suggest-items')
  async suggestItemsForShoppingList(
    @Param('id') shoppingListId: string,
    @ActiveUser() userActive: ActiveUserInterface,
  ) {
    return await this.shoppingListService.suggestItemsForShoppingList(
      shoppingListId,
      userActive,
    );
  }

  @Get('items/recent')
  async getRecentItems(@ActiveUser() userActive: ActiveUserInterface) {
    return await this.shoppingListService.getRecentItems(userActive);
  }

  @Get(':id/items')
  async getItemsByShoppingList(
    @Param('id') shoppingListId: string,
    @ActiveUser() userActive: ActiveUserInterface,
  ) {
    return await this.shoppingListService.getItemsByShoppingList(
      shoppingListId,
      userActive,
    );
  }
}
