import chalk from "chalk";
import { Client } from "discord.js";
import cron from "node-cron";
import { MonitoredAccountModel } from "../models/MonitoredAccount";
import { BanAPI } from "../RobloxAPI";
import {
  sendAccountCanBeReactivated,
  sendBanStatusUpdate,
} from "../Notifications";

let isCheckingBans = false;

async function doBanCheck(client: Client) {
  if (isCheckingBans) return;
  isCheckingBans = true;
  const allMonitoredAccounts = await MonitoredAccountModel.where();

  for (const monitoredAccount of allMonitoredAccounts) {
    if (monitoredAccount.cookieStatus !== "VALID") continue;

    const accountBanStatus = await BanAPI.isAccountBanned(
      monitoredAccount.accountCookie
    );
    if (accountBanStatus === false) continue;

    const currentBanStatus = accountBanStatus === null ? "UNBANNED" : "BANNED";

    if (currentBanStatus !== monitoredAccount.banStatus) {
      if (
        monitoredAccount.banStatus === "UNBANNED" &&
        currentBanStatus == "BANNED"
      ) {
        sendBanStatusUpdate(
          "BANNED",
          monitoredAccount.userId,
          accountBanStatus
        );
      } else {
        sendBanStatusUpdate("UNBANNED", monitoredAccount.userId, null);
      }

      await MonitoredAccountModel.updateOne(
        {
          userId: monitoredAccount.userId,
        },
        { banStatus: currentBanStatus }
      );
    }

    if (currentBanStatus === "BANNED" && accountBanStatus) {
      if (
        Math.floor(Date.now() / 1000) > accountBanStatus.banEndUnix &&
        Math.floor(Date.now() / 1000) < accountBanStatus.banStartUnix + 60
      ) {
        sendAccountCanBeReactivated(
          monitoredAccount.userId,
          monitoredAccount.addedBy
        );
      }
    }
  }

  isCheckingBans = false;
}

export async function execute(client: Client) {
  cron.schedule("*/1 * * * *", async () => {
    await doBanCheck(client);
  });
  console.log(chalk.green("[BAN-MONITOR] Started monitoring accounts."));
}
