import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { Paths } from '../../../core/models/util.models';
import { Order } from './order.model';

export type SortColumn = Paths<Order> | '';
export type SortDirection = 'asc' | 'desc' | '';
const rotate: { [key: string]: SortDirection } = { 'asc': 'desc', 'desc': '', '': 'asc' };

export interface listSortEvent {
  column: SortColumn;
  direction: SortDirection;
}

@Directive({
  selector: 'th[listsortable]',
  host: {
    '[class.asc]': 'direction === "asc"',
    '[class.desc]': 'direction === "desc"',
    '(click)': 'rotate()'
  }
})
export class NgbdListSortableHeader {

  @Input() listsortable: SortColumn = '';
  @Input() direction: SortDirection = '';
  @Output() sort = new EventEmitter<listSortEvent>();

  rotate() {
    this.direction = rotate[this.direction];
    this.sort.emit({ column: this.listsortable, direction: this.direction });
  }
}
