import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings } from './setting.schema'; 

@Injectable()
export class SettingService {
  constructor(
    @InjectModel(Settings.name) private settingsModel: Model<Settings>,
  ) {}

  async getSettings() {
    let settings = await this.settingsModel.findOne();
    if (!settings) {
      settings = await this.settingsModel.create({});
    }
    return settings;
  }

  async updateSettings(data: Partial<Settings>) {
    const settings = await this.getSettings();
    if (data.username) settings.username = data.username;
    return settings.save();
  }
}