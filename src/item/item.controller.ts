import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
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

  @Post()
  async createItemForShoppingList(
    @Body() itemData: CreateItemDto,
    @ActiveUser() userActive: ActiveUserInterface,
  ) {
    const shoppingList = await this.shoppingListService.findShoppingListById(
      itemData.shoppingListId,
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

  @Patch(':id') async updateItem(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateItemDto>,
  ) {
    return await this.itemService.updateItem(id, updateData);
  }
  @Delete(':id') async deleteItem(@Param('id') id: string) {
    return await this.itemService.deleteItem(id);
  }
}
