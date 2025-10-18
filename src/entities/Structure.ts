import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { InternalRoute } from './InternalRoute';

@Entity('structure')
export class Structure {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column('geometry', { spatialFeatureType: 'Polygon', srid: 4326 })
  geometry: any;

  @Column('geometry', { spatialFeatureType: 'Point', srid: 4326 })
  centroid: any;

  @Column('int', { array: true, nullable: true })
  floors?: number[];

  @OneToMany(() => InternalRoute, route => route.structure)
  routes: InternalRoute[];
}