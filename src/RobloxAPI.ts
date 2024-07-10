import axios from "axios";
import moment from "moment-timezone";
import { MonitoredAccountModel } from "./models/MonitoredAccount";
import { sendCookieInvalidUpdate } from "./Notifications";

export function parseToUnixEpoch(dateString: string): number {
  const date = moment.tz(dateString, "UTC");

  return date.unix();
}

export type BanInformation = {
  banType: string;
  banUserMessage: string;
  banStartUnix: number;
  banEndUnix: number;
};

export type AuthenticatedUserInfo = {
  id: number;
  name: string;
  displayName: string;
};

export class RobloxAPI {
  static async getUsernameFromUserId(userId: number): Promise<string | null> {
    try {
      const response = await axios.get(
        `https://users.roblox.com/v1/users/${userId}`
      );

      return response.data.name;
    } catch (err) {
      return null;
    }
  }

  static async getAuthenticatedUserInfo(
    accountCookie: string
  ): Promise<AuthenticatedUserInfo | null> {
    try {
      const response = await axios.get(
        "https://users.roblox.com/v1/users/authenticated",
        {
          headers: {
            Cookie: `.ROBLOSECURITY=${accountCookie};`,
          },
        }
      );

      return response.data as AuthenticatedUserInfo;
    } catch (err) {
      return null;
    }
  }

  static async verifyRobloxCookie(cookie: string): Promise<boolean> {
    try {
      await axios.get("https://accountsettings.roblox.com/v1/email", {
        headers: {
          Cookie: `.ROBLOSECURITY=${cookie};`,
        },
      });

      return true;
    } catch (err) {
      return false;
    }
  }
}

export class BanAPI {
  static async isAccountBanned(
    accountCookie: string,
    isFirstRequest: boolean = false
  ): Promise<BanInformation | null | false> {
    try {
      const response = await axios.get(
        "https://usermoderation.roblox.com/v1/not-approved",
        {
          headers: {
            "Content-Type": "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; rv:127.0) Gecko/20100101 Firefox/127.0",
            Cookie: `.ROBLOSECURITY=${accountCookie};`,
          },
        }
      );

      const banData = response.data;

      if (banData.interventionId === undefined) {
        return null;
      } else {
        const userMessage = banData.messageToUser;
        const banBeginUnix = parseToUnixEpoch(banData.beginDate);
        const banEndUnix = parseToUnixEpoch(banData.endDate);
        const banType = banData.badUtterances[0].utteranceText;

        const banInfo: BanInformation = {
          banType,
          banUserMessage: userMessage,
          banStartUnix: banBeginUnix,
          banEndUnix: banEndUnix,
        };

        return banInfo;
      }
    } catch (err: any) {
      if (err.response.status === 401) {
        if (isFirstRequest) return null;
        const accountData = await MonitoredAccountModel.findOne({
          accountCookie: accountCookie,
        });
        if (!accountData) return false;

        await MonitoredAccountModel.updateOne(
          {
            accountCookie: accountCookie,
          },
          {
            cookieStatus: "INVALID",
          }
        );

        sendCookieInvalidUpdate(accountData.userId, accountData.addedBy);
      }

      return false;
    }
  }
}
