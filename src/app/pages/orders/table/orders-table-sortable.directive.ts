import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { OrderByDirection } from '@angular/fire/firestore';
import { Paths } from '../../../core/models/util.models';
import { Order } from './order.model';

export type OrderSortColumn = Paths<Order>;
export type OrderSortDirection = OrderByDirection;

export const allowedOrderSorts: Readonly<SortEvent>[] = [
    {
        column: 'createdDate',
        direction: 'asc',
    },
    {
        column: 'createdDate',
        direction: 'desc',
    },
    {
        column: 'localSolutionRes.count',
        direction: 'desc',
    },
    {
        column: 'amountTotal',
        direction: 'desc',
    },
];

export interface Sort {
  column: OrderSortColumn;
  direction: OrderSortDirection | '';
}

export type SortEvent = Omit<Sort, 'direction'> & {direction: OrderSortDirection};

@Directive({
  selector: 'th[listsortable]',
  host: {
    '[class.asc]': 'direction === "asc"',
    '[class.desc]': 'direction === "desc"',
    '[class.sort]': '!!availableDirections.length',
    '[class.cursor-pointer]': '!!availableDirections.length',
    '[class.no-asc]': 'availableDirections.length === 1 && availableDirections[0] === "desc"',
    '[class.no-desc]': 'availableDirections.length === 1 && availableDirections[0] === "asc"',
    '(click)': 'rotate()'
  }
})
export class NgbdListSortableHeader {
  @Input() listsortable: OrderSortColumn = 'createdDate';
  @Input() direction: Sort['direction'] = 'desc';
  @Input() availableDirections: OrderSortDirection[] = [];

  @Output() sort = new EventEmitter<SortEvent>();

  rotate() {
      if (!!this.availableDirections.length) {
          let direction: Sort['direction'] | undefined = undefined;

          switch (this.direction) {
              case "":
                  if (this.availableDirections.includes('asc')) {
                      direction = 'asc';
                  } else {
                      direction = 'desc';
                  }
                  break;
              case "asc":
                  if (this.availableDirections.includes('desc')) {
                      direction = 'desc';
                  }
                  break;
              case "desc":
                  if (this.availableDirections.includes('asc')) {
                      direction = 'asc';
                  }
                  break;
          }

          if (direction) {
              this.sort.emit({ column: this.listsortable, direction });
          }
      }
  }
}
