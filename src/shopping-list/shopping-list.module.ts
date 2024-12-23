import { Module, forwardRef } from '@nestjs/common';
import { ShoppingListService } from './shopping-list.service';
import { ShoppingListController } from './shopping-list.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingList } from './entities/shopping-list.entity';
import { ItemModule } from '../item/item.module';
import { AuthGuard } from '../auth/guard/auth.guard';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShoppingList]),
    forwardRef(() => ItemModule),
  ],
  controllers: [ShoppingListController],
  providers: [ShoppingListService, AuthGuard, JwtService],
  exports: [ShoppingListService],
})
export class ShoppingListModule {}
