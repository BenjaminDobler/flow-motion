import { Component } from '@angular/core';

@Component({
  selector: 'lib-fonts-picker',
  imports: [],
  templateUrl: './fonts-picker.component.html',
  styleUrl: './fonts-picker.component.scss',
})
export class FontsPickerComponent {
  async ngAfterViewInit() {
    try {
      const availableFonts = await window.queryLocalFonts();
      for (const fontData of availableFonts) {
        console.log(fontData.postscriptName);
        console.log(fontData.fullName);
        console.log(fontData.family);
        console.log(fontData.style);
      }
    } catch (err) {
      console.error(err.name, err.message);
    }
  }
}
