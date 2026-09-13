import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../app';

@Component({
  selector: 'app-skill-dropdown-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './skill-dropdown-portal.component.html',
  host: { style: 'display: contents;' }
})
export class SkillDropdownPortalComponent {
  public app = inject(App);
}
