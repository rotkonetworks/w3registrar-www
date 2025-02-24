import { UserCircle, AtSign, Mail, XIcon, Globe, IdCard, Github, Fingerprint, Image } from "lucide-react";
import { DiscordIcon } from "./discord";

export const SOCIAL_ICONS = {
  display: <UserCircle className="h-4 w-4" />,
  matrix: <AtSign className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  discord: <DiscordIcon className="h-4 w-4" />,
  Twitter: <XIcon className="h-4 w-4" />,
  web: <Globe className="h-4 w-4" />,
  legal: <IdCard className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  github: <Github className="h-4 w-4" />,
  pgp_fingerprint: <Fingerprint className="h-4 w-4" />,
}
