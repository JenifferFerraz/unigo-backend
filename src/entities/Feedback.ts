import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('feedbacks')
export class Feedback {
  @PrimaryGeneratedColumn()
  id: number;

  // Relação opcional com usuário (null para visitantes anônimos)
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'user_id', nullable: true })
  userId: number | null;

  // Parte 1: Perfil do usuário
  @Column({ type: 'varchar', length: 50 })
  vinculo: string; // 'aluno', 'visitante', 'funcionario'

  @Column({ name: 'ja_usou_app_interno', type: 'boolean' })
  jaUsouAppInterno: boolean;

  // Parte 1: Navegação Básica (Likert 1-5)
  @Column({ name: 'identificar_localizacao', type: 'smallint' })
  identificarLocalizacao: number; // Q3

  @Column({ name: 'instrucoes_claras', type: 'smallint' })
  instrucoesClaras: number; // Q4

  // Parte 2: Usabilidade e Interface (Likert 1-5)
  @Column({ name: 'representacao_fiel', type: 'smallint' })
  representacaoFiel: number; // Q5

  @Column({ name: 'trajeto_facil_seguir', type: 'smallint' })
  trajetoFacilSeguir: number; // Q6

  @Column({ name: 'facil_usar', type: 'smallint' })
  facilUsar: number; // Q7

  @Column({ name: 'design_claro', type: 'smallint' })
  designClaro: number; // Q8

  @Column({ name: 'interacao_sem_dificuldade', type: 'smallint' })
  interacaoSemDificuldade: number; // Q9

  // Parte 3: Eficiência e Satisfação (Likert 1-5)
  @Column({ name: 'tempo_razoavel', type: 'smallint' })
  tempoRazoavel: number; // Q10

  @Column({ name: 'confianca_destino', type: 'smallint' })
  confiancaDestino: number; // Q11

  @Column({ name: 'recomendaria', type: 'smallint' })
  recomendaria: number; // Q12

  @Column({ name: 'voltaria_usar', type: 'smallint' })
  voltariaUsar: number; // Q13

  @Column({ name: 'satisfacao_geral', type: 'smallint' })
  satisfacaoGeral: number; // Q14

  // Parte 4: Perguntas Abertas (opcionais)
  @Column({ name: 'o_que_agradou', type: 'text', nullable: true })
  oQueAgradou: string | null;

  @Column({ name: 'dificuldades_encontradas', type: 'text', nullable: true })
  dificuldadesEncontradas: string | null;

  @Column({ name: 'sugestoes_melhoria', type: 'text', nullable: true })
  sugestoesMelhoria: string | null;

  // Metadados
  @Column({ name: 'is_anonymous', type: 'boolean', default: false })
  isAnonymous: boolean;

  @Column({ name: 'device_info', type: 'varchar', length: 255, nullable: true })
  deviceInfo: string | null; // Ex: "Android 13", "iOS 16", "Web Chrome"

  @Column({ name: 'app_version', type: 'varchar', length: 50, nullable: true })
  appVersion: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
