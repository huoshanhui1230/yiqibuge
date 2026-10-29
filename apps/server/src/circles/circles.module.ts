import { Module } from "@nestjs/common";

import { CircleStore } from "./circle-store";
import { CirclesController, InvitesController } from "./circles.controller";
import { CirclesService } from "./circles.service";
import { InvitesService } from "./invites.service";
import { MembershipService } from "./membership.service";

/** 群组：建群、设置、成员、邀请、加入、退群、移除、转让、解散 */
@Module({
  controllers: [CirclesController, InvitesController],
  providers: [CircleStore, CirclesService, InvitesService, MembershipService],
})
export class CirclesModule {}
