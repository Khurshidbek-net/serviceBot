import { Column, DataType, Model, Table } from "sequelize-typescript";

interface ICustomerCreationAttr {
  user_id?: number;
  username?: string;
  first_name?: string;
  phone_number?: string;
  last_state?: string;
}

@Table({ tableName: "customer" })
export class Customer extends Model<Customer, ICustomerCreationAttr> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true
  })
  user_id: number;

  @Column({
    type: DataType.STRING,
  })
  username: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  first_name: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  phone_number: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  last_state: string | undefined;
}