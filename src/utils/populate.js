export const populateZaboPrivateStats = (zabo, self) => {
  if (!self) return zabo.toJSON ();
  const zaboJSON = zabo.toJSON ();
  const { likesWithTime, pins } = zabo;
  return {
    ...zaboJSON,
    isLiked: likesWithTime.some (like => self._id.equals (like.user)),
    isPinned: self.boards.some (board => pins.findIndex (pin => pin.equals (board)) >= 0),
  };
};
export const populateZabosPrivateStats = (zabos, self) => {
  const result = zabos.slice ();
  if (!self) return result;
  return zabos.map (zabo => populateZaboPrivateStats (zabo, self));
};
