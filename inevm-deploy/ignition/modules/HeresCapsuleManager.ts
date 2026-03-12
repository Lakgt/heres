import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("HeresCapsuleManagerModule", (m) => {
  const capsuleManager = m.contract("HeresCapsuleManager");
  return { capsuleManager };
});
