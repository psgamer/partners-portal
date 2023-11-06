import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { ordersModel } from './dashboard.model';

export type SortColumn = keyof ordersModel | '';
export type SortDirection = 'asc' | 'desc' | '';
const rotate: {[key: string]: SortDirection} = { 'asc': 'desc', 'desc': '', '': 'asc' };

export interface OrderSortEvent {
  column: SortColumn;
  direction: SortDirection;
}


@Directive({
  selector: "'th[Ordersortable]','button[Ordersortable]'",
  host: {
    '[class.asc]': 'direction === "asc"',
    '[class.desc]': 'direction === "desc"',
    '(click)': 'rotate()'
  }
})
export class NgbdIndexsSortableHeader {

  @Input() Ordersortable: SortColumn = '';
  @Input() direction: SortDirection = '';
  @Output() Ordersort = new EventEmitter<OrderSortEvent>();

  rotate() {
    this.direction = rotate[this.direction];
    this.Ordersort.emit({column: this.Ordersortable, direction: this.direction});
  }
}
