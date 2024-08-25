// import * as moment from 'moment-timezone';
// import {
//   BeforeInsert,
//   BeforeUpdate,
//   CreateDateColumn,
//   Index,
//   PrimaryGeneratedColumn,
//   UpdateDateColumn,
// } from 'typeorm';

// export class AbstractEntity {
//   @Index()
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Index()
//   @CreateDateColumn({ type: 'timestamptz' })
//   createdAt: Date;

//   @Index()
//   @UpdateDateColumn({ type: 'timestamptz' })
//   updatedAt: Date;

//   // generate Asia/dhaka current date and time
//   currentDateTime: Date = moment().tz('Asia/Dhaka').toDate();

//   @BeforeInsert()
//   before() {
//     if (!this.createdAt) this.createdAt = this.currentDateTime;
//     if (!this.updatedAt) this.updatedAt = this.currentDateTime;
//   }
//   @BeforeUpdate()
//   update() {
//     this.updatedAt = this.currentDateTime;
//   }
// }
