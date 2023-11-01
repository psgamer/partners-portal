import {Component} from '@angular/core';
import {
  DATA_PRELOADER,
  LAYOUT_MODE,
  LAYOUT_POSITION,
  LAYOUT_THEME,
  LAYOUT_WIDTH,
  SIDEBAR_COLOR,
  SIDEBAR_IMAGE,
  SIDEBAR_SIZE,
  SIDEBAR_VIEW,
  TOPBAR
} from '../layout.model';

import {EventService} from 'src/app/core/services/event.service';

@Component({
  selector: 'app-two-column',
  templateUrl: './two-column.component.html',
  styleUrls: ['./two-column.component.scss']
})

/**
 * TwoColumnComponent
 */
export class TwoColumnComponent {

  constructor(public eventService: EventService) {

  }
  isCondensed = false;

  ngOnInit() {
    document.documentElement.setAttribute('data-layout', 'twocolumn');
    const theme = document.documentElement.getAttribute('data-theme') || LAYOUT_THEME

    document.documentElement.setAttribute('data-topbar', TOPBAR);
    document.documentElement.setAttribute('data-sidebar', SIDEBAR_COLOR);
    document.documentElement.setAttribute('data-sidebar-size', SIDEBAR_SIZE);
    document.documentElement.setAttribute('data-layout-style', SIDEBAR_VIEW);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', LAYOUT_MODE);
    document.documentElement.setAttribute('data-layout-width', LAYOUT_WIDTH);
    document.documentElement.setAttribute('data-sidebar-image', SIDEBAR_IMAGE);
    document.documentElement.setAttribute('data-layout-position', LAYOUT_POSITION);
    document.documentElement.setAttribute('data-preloader', DATA_PRELOADER);

    window.addEventListener('resize', () => {
      if (document.documentElement.getAttribute('data-layout') == "twocolumn") {
        if (document.documentElement.clientWidth <= 767) {
          this.eventService.broadcast('changeLayout', 'vertical');
          document.documentElement.setAttribute('data-layout', 'vertical');
          document.body.classList.add('twocolumn-panel');
        } else {
          this.eventService.broadcast('changeLayout', 'twocolumn');
          document.documentElement.setAttribute('data-layout', 'twocolumn');
          document.body.classList.remove('twocolumn-panel');
        }
      }
      else {
        if (document.body.classList.contains('twocolumn-panel')) {
          if (document.documentElement.clientWidth <= 767) {
            this.eventService.broadcast('changeLayout', 'vertical');
            document.documentElement.setAttribute('data-layout', 'vertical');
          } else {
            this.eventService.broadcast('changeLayout', 'twocolumn');
            document.documentElement.setAttribute('data-layout', 'twocolumn');
            document.body.classList.remove('twocolumn-panel')
          }
        }
      }
    })
  }


  /**
   * On mobile toggle button clicked
   */
  onToggleMobileMenu() {
    if (document.documentElement.clientWidth <= 767) {
      document.body.classList.toggle('vertical-sidebar-enable');
    } else {
      document.body.classList.toggle('twocolumn-panel');
    }
  }

  /**
   * on settings button clicked from topbar
   */
  onSettingsButtonClicked() {
    document.body.classList.toggle('right-bar-enabled');
    const rightBar = document.getElementById('theme-settings-offcanvas');
    if (rightBar != null) {
      rightBar.classList.toggle('show');
      rightBar.setAttribute('style', "visibility: visible;");
    }
  }

}
