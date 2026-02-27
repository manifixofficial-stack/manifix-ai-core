import Camera from "./camera";
import Check from "./check.svg";
import Comment from "./comment.svg";
import Energy from "./energy.svg";
import Explore from "./explore.svg";
import Goal from "./goal.svg";
import Health from "./health.svg";
import Home from "./home.svg";
import Like from "./like.svg";
import Logout from "./logout.svg";
import Mic from "./mic.svg";
import Music from "./music.svg";
import Notification from "./notification.svg";
import Play from "./play.svg";
import Premium from "./premium.svg";
import Profile from "./profile.svg";
import Search from "./search.svg";
import Share from "./share.svg";
import Star from "./star.svg";
import Voice from "./voice.svg";
import Yoga from "./yoga.svg";

export const SvgIcons = {
  camera: Camera,
  check: Check,
  comment: Comment,
  energy: Energy,
  explore: Explore,
  goal: Goal,
  health: Health,
  home: Home,
  like: Like,
  logout: Logout,
  mic: Mic,
  music: Music,
  notification: Notification,
  play: Play,
  premium: Premium,
  profile: Profile,
  search: Search,
  share: Share,
  star: Star,
  voice: Voice,
  yoga: Yoga,
} as const;

export type SvgIconName = keyof typeof SvgIcons;