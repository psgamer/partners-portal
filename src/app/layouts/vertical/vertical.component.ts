import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
    DATA_PRELOADER, LAYOUT, LAYOUT_MODE, LAYOUT_POSITION, LAYOUT_THEME, LAYOUT_WIDTH, SIDEBAR_COLOR, SIDEBAR_IMAGE, SIDEBAR_SIZE,
    SIDEBAR_VIEW, TOPBAR
} from '../layout.model';

@UntilDestroy()
@Component({
  selector: 'app-vertical',
  templateUrl: './vertical.component.html',
  styleUrls: ['./vertical.component.scss']
})
export class VerticalComponent {

  isCondensed = false;
  dataloader: any;
  isLoading: any;

  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    const layout = document.documentElement.getAttribute('data-layout') || LAYOUT
    const theme = document.documentElement.getAttribute('data-theme') || LAYOUT_THEME

    document.documentElement.setAttribute('data-layout', layout);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-sidebar', SIDEBAR_COLOR);
    document.documentElement.setAttribute('data-sidebar-size', SIDEBAR_SIZE);
    document.documentElement.setAttribute('data-bs-theme', LAYOUT_MODE);
    document.documentElement.setAttribute('data-topbar', TOPBAR);
    document.documentElement.setAttribute('data-layout-width', LAYOUT_WIDTH);
    document.documentElement.setAttribute('data-sidebar-image', SIDEBAR_IMAGE);
    document.documentElement.setAttribute('data-layout-position', LAYOUT_POSITION);
    document.documentElement.setAttribute('data-layout-style', SIDEBAR_VIEW);
    document.documentElement.setAttribute('data-preloader', DATA_PRELOADER);



    this.router.events.pipe(untilDestroyed(this)).subscribe((event: any) => {
      if (document.documentElement.getAttribute('data-preloader') == 'enable') {
        if (event instanceof NavigationEnd) {
          // Update the attribute state based on the current route or any other conditions
          if (event.url !== '/disabled-route') {
            document.documentElement.setAttribute('data-preloader', 'enable');
            setTimeout(() => {
              document.documentElement.setAttribute('data-preloader', 'disable');
            }, 1000);
          } else {
            document.documentElement.setAttribute('data-preloader', 'disable');
          }
        }
      } else {
        document.documentElement.setAttribute('data-preloader', 'disable');
      }
    });

    window.addEventListener('resize', function () {
      if (document.documentElement.clientWidth <= 767) {
        document.documentElement.setAttribute('data-sidebar-size', '');
        document.querySelector('.hamburger-icon')?.classList.add('open')
      }
      else if (document.documentElement.clientWidth <= 1024) {
        document.documentElement.setAttribute('data-sidebar-size', 'sm');
        document.querySelector('.hamburger-icon')?.classList.add('open')
        document.body.classList.remove('vertical-sidebar-enable');
      }
      else if (document.documentElement.clientWidth >= 1024) {
        document.documentElement.setAttribute('data-sidebar-size', 'lg');
        document.querySelector('.hamburger-icon')?.classList.remove('open');
        document.body.classList.remove('vertical-sidebar-enable');
      }
    })

  }

  /**
  * On mobile toggle button clicked
  */
  onToggleMobileMenu() {
    const currentSIdebarSize = document.documentElement.getAttribute("data-sidebar-size");
    if (document.documentElement.clientWidth >= 767) {
      if (currentSIdebarSize == null) {
        (document.documentElement.getAttribute('data-sidebar-size') == null || document.documentElement.getAttribute('data-sidebar-size') == "lg") ? document.documentElement.setAttribute('data-sidebar-size', 'sm') : document.documentElement.setAttribute('data-sidebar-size', 'lg')
      } else if (currentSIdebarSize == "md") {
        (document.documentElement.getAttribute('data-sidebar-size') == "md") ? document.documentElement.setAttribute('data-sidebar-size', 'sm') : document.documentElement.setAttribute('data-sidebar-size', 'md')
      } else {
        (document.documentElement.getAttribute('data-sidebar-size') == "sm") ? document.documentElement.setAttribute('data-sidebar-size', 'lg') : document.documentElement.setAttribute('data-sidebar-size', 'sm')
      }
    }

    if (document.documentElement.clientWidth <= 767) {
      document.body.classList.add('vertical-sidebar-enable');
    }
    this.isCondensed = !this.isCondensed;
  }

  /**
   * on settings button clicked from topbar
   */
  onSettingsButtonClicked() {
    document.querySelector('.custom-offcanvas')?.classList.toggle('show')
    document.getElementById('backdrop')?.classList.toggle('show')
    // document.body.classList.toggle('right-bar-enabled');
    // const rightBar = document.getElementById('theme-settings-offcanvas');
    // if (rightBar != null) {
    //   rightBar.classList.toggle('show');
    //   rightBar.setAttribute('style', "visibility: visible;");

    // }
  }

}
