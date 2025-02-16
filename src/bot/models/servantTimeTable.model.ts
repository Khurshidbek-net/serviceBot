import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IServantTimeCreationAttr {
  user_id?: number;
  dateTime: string;
  isBooked: boolean;
}

@Table({ tableName: "servantTimeTable" })
export class ServantTimeTable extends Model<ServantTimeTable, IServantTimeCreationAttr> {

  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true
  })

  id: number;
  @Column({
    type: DataType.BIGINT,
  })
  user_id: number;

  @Column({
    type: DataType.STRING,
  })
  dateTime: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  isBooked: boolean;
}