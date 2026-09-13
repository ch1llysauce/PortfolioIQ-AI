import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../app';

@Component({
  selector: 'div[app-github]',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './github.component.html'
})
export class GithubComponent {
  public app = inject(App);
}
