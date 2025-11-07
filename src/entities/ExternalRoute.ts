import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('external_route')
export class ExternalRoute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column('geometry', { spatialFeatureType: 'MultiLineString', srid: 4326 })
  geometry: any;

  @Column('jsonb', { nullable: true })
  properties?: any;
}