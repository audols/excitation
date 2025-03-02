import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Question } from "./Question";
import { Form } from "./Form";

@Entity({
    name: 'template',
    schema: 'dbo'
})
export class Template {
    @PrimaryGeneratedColumn()
    templateId!: number;

    @Column({ type: 'varchar', length: 255 })
    templateName!: string;

    @Column({ type: 'varchar', length: 255 })
    creator!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    modifiedAt!: Date;

    @OneToMany(() => Question, question => question.template)
    questions!: Question[]

    @RelationId((template: Template) => template.questions)
    questionIds!: number[]

    @OneToMany(() => Form, form => form.template)
    forms!: Form[]

    @RelationId((template: Template) => template.forms)
    formIds!: number[]
}
