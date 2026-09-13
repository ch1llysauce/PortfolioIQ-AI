import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../app';

@Component({
  selector: 'div[app-projects]',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projects.component.html'
})
export class ProjectsComponent {
  public app = inject(App);
}
