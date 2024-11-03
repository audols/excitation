import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Template } from "./Template";
import { Document } from "./Document";
import { Citation } from "./Citation";

@Entity({
    name: 'form',
    schema: 'dbo'
})
export class Form {
    @PrimaryGeneratedColumn()
    form_id!: number;

    @ManyToOne((type) => Template)
    @JoinColumn({ name: 'template_id' })
    template: Template;

    @RelationId((form: Form) => form.template)
    @Column({ type: 'int', nullable: true })
    template_id: number;

    @Column('text')
    form_name!: string;

    @Column('text')
    creator!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    modified_at!: Date;

    @OneToMany(() => Document, document => document.form)
    documents!: Document[];

    @RelationId((form: Form) => form.documents)
    documentIds!: number[];

    @OneToMany(() => Citation, citation => citation.form)
    citations!: Citation[];

    @RelationId((form: Form) => form.citations)
    citationIds!: string[];
}