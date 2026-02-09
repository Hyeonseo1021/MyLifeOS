import { Controller, Get, Post, Body } from '@nestjs/common';
import { SettingService } from './setting.service';
import { Settings } from './setting.schema';

@Controller('settings') 
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  async getSettings() {
    return this.settingService.getSettings();
  }

  @Post()
  async updateSettings(@Body() data: Partial<Settings>) {
    return this.settingService.updateSettings(data);
  }
}