// import * as moment from 'moment-timezone';
// import {
//   BeforeInsert,
//   BeforeUpdate,
//   CreateDateColumn,
//   PrimaryGeneratedColumn,
//   UpdateDateColumn,
// } from 'typeorm';

// export class AbstractEntity {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @CreateDateColumn({ type: 'timestamptz' })
//   createdAt: Date;

//   @UpdateDateColumn({ type: 'timestamptz' })
//   updatedAt: Date;

//   // generate current date and time
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
