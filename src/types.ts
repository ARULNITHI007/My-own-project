import { Timestamp } from 'firebase/firestore';

export interface ProductItem {
  id: string;
  nameKey: 'udaithal' | 'house' | 'milagai' | 'livestock';
  kg: number;
  price: number;
  total: number;
}

export interface TokenRecord {
  id?: string;
  tokenNumber: number;
  customerName: string;
  items: ProductItem[];
  totalAmount: number;
  previousAmount: number;
  status: 'pending' | 'completed';
  paymentStatus: 'unpaid' | 'paid';
  createdAt: Timestamp;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
