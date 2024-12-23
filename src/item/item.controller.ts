import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';
import { ActiveUserInterface } from '../common/interface/activeUserInterface';
import { AuthGuard } from '../auth/guard/auth.guard';
import { ActiveUser } from '../common/decorators/active-user.decorator';
import { ShoppingListService } from '../shopping-list/shopping-list.service';

@Controller('items')
@UseGuards(AuthGuard)
export class ItemController {
  constructor(
    private readonly itemService: ItemService,
    private readonly shoppingListService: ShoppingListService,
  ) {}

  @Post(':shoppingListId')
  async createItemForShoppingList(
    @Param('shoppingListId') shoppingListId: string,
    @Body() itemData: CreateItemDto,
    @ActiveUser() userActive: ActiveUserInterface,
  ) {
    const shoppingList = await this.shoppingListService.findShoppingListById(
      shoppingListId,
      userActive,
    );
    return await this.itemService.createItemForShoppingList(
      shoppingList,
      itemData,
    );
  }

  @Get(':shoppingListId')
  async findAllByShoppingList(@Param('shoppingListId') shoppingListId: string) {
    return await this.itemService.findAllByShoppingList(shoppingListId);
  }
}
