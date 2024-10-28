import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

@Entity({ name: "refreshTokens" })
export class RefreshToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "timestamp" })
    expiresIn: Date;

    @ManyToOne(() => User)
    user: User;

    @UpdateDateColumn()
    updatesAt: number;

    @CreateDateColumn()
    createdAt: number;
}
