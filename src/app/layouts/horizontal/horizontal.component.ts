import {Component} from '@angular/core';
import {
  DATA_PRELOADER,
  LAYOUT_MODE,
  LAYOUT_POSITION,
  LAYOUT_THEME,
  LAYOUT_WIDTH,
  SIDEBAR_COLOR,
  SIDEBAR_IMAGE,
  SIDEBAR_VIEW,
  TOPBAR
} from '../layout.model';

@Component({
  selector: 'app-horizontal',
  templateUrl: './horizontal.component.html',
  styleUrls: ['./horizontal.component.scss']
})
export class HorizontalComponent {
  constructor() { }

  isCondensed = false;

  ngOnInit(): void {
    document.documentElement.setAttribute('data-layout', 'horizontal');
    const theme = document.documentElement.getAttribute('data-theme') || LAYOUT_THEME

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-sidebar', SIDEBAR_COLOR);
    document.documentElement.setAttribute('data-bs-theme', LAYOUT_MODE);
    document.documentElement.setAttribute('data-topbar', TOPBAR);
    document.documentElement.setAttribute('data-layout-width', LAYOUT_WIDTH);
    document.documentElement.setAttribute('data-sidebar-image', SIDEBAR_IMAGE);
    document.documentElement.setAttribute('data-layout-position', LAYOUT_POSITION);
    document.documentElement.setAttribute('data-layout-style', SIDEBAR_VIEW);
    document.documentElement.setAttribute('data-preloader', DATA_PRELOADER);
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

  /**
   * On mobile toggle button clicked
   */
  onToggleMobileMenu() {
    if (document.documentElement.clientWidth <= 1024) {
      document.body.classList.toggle('menu');
    }
  }
}
