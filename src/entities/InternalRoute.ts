import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Structure } from './Structure';

@Entity('internal_route')
export class InternalRoute {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Structure, structure => structure.routes)
  structure: Structure;

  @Column()
  floor: number;

  @Column('geometry', { spatialFeatureType: 'MultiLineString', srid: 4326 })
  geometry: any;

  @Column('jsonb', { nullable: true })
  properties?: any;
}