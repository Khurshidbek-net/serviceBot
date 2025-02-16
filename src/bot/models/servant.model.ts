import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IServantCreationAttr {
  user_id?: number;
  username?: string;
  first_name?: string;
  // phone_number?: string;
  // workshop_name?: string;
  // address?: string;
  // landmark?: string;
  // location?: string;
  // start_time?: string;
  // rating?: string;
  // end_time?: string;
  // average_service_time?: number;
  job: string | undefined;
  last_state: string | undefined;
}

@Table({ tableName: "servant" })
export class Servant extends Model<Servant, IServantCreationAttr> {
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
  job: string;

  @Column({
    type: DataType.STRING,
  })
  phone_number: string | undefined;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  workshop_name: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  last_state: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  address: string | undefined;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  landmark: string | undefined;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  location: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  start_time: string;

  @Column({
    type: DataType.STRING,
  })
  end_time: string;

  @Column({
    type: DataType.STRING,
  })
  rating: string | undefined;

  @Column({
    type: DataType.STRING,
  })
  average_service_time: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  status: boolean
}
