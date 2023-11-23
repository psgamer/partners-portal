import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { OrderSort, OrderSortColumn, OrderSortDirection, OrderSortEvent } from './order.service';

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
  @Input() direction: OrderSort['direction'] = 'desc';
  @Input() availableDirections: OrderSortDirection[] = [];

  @Output() sort = new EventEmitter<OrderSortEvent>();

  rotate() {
      if (!!this.availableDirections.length) {
          let direction: OrderSort['direction'] | undefined = undefined;

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
