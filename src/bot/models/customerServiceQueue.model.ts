import { Column, DataType, Model, Table } from "sequelize-typescript";

interface ICustomerServicesAttr {
  id: number;
  customer_id: number;
  servant_id: number;
  service_name: string;
  date_time: Date;
  status: string;
}

@Table({ tableName: "customerServicesQueue" })
export class CustomerServiceQueue extends Model<CustomerServiceQueue, ICustomerServicesAttr> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.BIGINT
  })
  customer_id: number;

  @Column({
    type: DataType.BIGINT
  })
  servant_id: number;

  @Column({
    type: DataType.STRING
  })
  service_name: string;

  @Column({
    type: DataType.DATE
  })
  date_time: Date;

  @Column({
    type: DataType.STRING,
    defaultValue: "pending", 
  })
  status: string;
}