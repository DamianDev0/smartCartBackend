import { Module, forwardRef } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { ShoppingList } from '../shopping-list/entities/shopping-list.entity';
import { AuthGuard } from '../auth/guard/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ShoppingListModule } from '../shopping-list/shopping-list.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item, ShoppingList]),
    forwardRef(() => ShoppingListModule),
  ],
  controllers: [ItemController],
  providers: [ItemService, AuthGuard, JwtService],
  exports: [ItemService],
})
export class ItemModule {}
