import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../app';

@Component({
  selector: 'header[app-header]',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  public app = inject(App);
}
