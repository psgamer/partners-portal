import {Component} from '@angular/core';
import {LAYOUT} from './layout.model';
import {EventService} from '../core/services/event.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {

  // layout related config
  layoutType!: string;
  showMain: any;

  constructor(private eventService: EventService) { }

  ngOnInit() {

    this.layoutType = LAYOUT;

    // listen to event and change the layout, theme, etc
    this.eventService.subscribe('changeLayout', (layout) => {
      this.layoutType = layout;
    });
  }
  /**
  * Check if the vertical layout is requested
  */
  isVerticalLayoutRequested() {
    return this.layoutType === 'vertical';
  }

  /**
   * Check if the horizontal layout is requested
   */
  isHorizontalLayoutRequested() {
    return this.layoutType === 'horizontal';
  }

  /**
   * Check if the horizontal layout is requested
   */
  isTwoColumnLayoutRequested() {
    return this.layoutType === 'twocolumn';
  }
}
