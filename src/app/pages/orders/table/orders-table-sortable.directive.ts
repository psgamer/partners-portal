import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { OrderByDirection } from '@angular/fire/firestore';
import { FirebaseDoc, Paths } from '../../../core/models/util.models';
import { Order } from './order.model';

export type SortColumn = Paths<FirebaseDoc<Order>>;
export type SortDirection = OrderByDirection;
const rotate: { [key: string]: SortDirection } = { 'asc': 'desc', 'desc': 'asc', '': 'asc' };

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
  @Input() listsortable: SortColumn = 'createdDate';
  @Input() direction: SortDirection | '' = 'desc';

  @Output() sort = new EventEmitter<listSortEvent>();

  rotate() {
    this.sort.emit({ column: this.listsortable, direction: rotate[this.direction] });
  }
}
