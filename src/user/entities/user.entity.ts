import { ShoppingList } from 'src/shopping-list/entities/shopping-list.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ select: false })
  password: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name?: string;

  @Column({ nullable: true, unique: true, type: 'varchar', length: 400 })
  fingerprintId?: string;

  @OneToMany(() => ShoppingList, (shoppingList) => shoppingList.user)
  shoppingLists: ShoppingList[];
}
