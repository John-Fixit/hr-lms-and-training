import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Drawer } from "antd";
import StarLoader from "../loaders/StarLoader";
import useCurrentUser from "../../../hooks/useCurrentUser";
import { useGetProfile } from "../../../API/profile";
import {
  buildLyncsFlightPayload,
  openLyncsFlightWidget,
} from "../../../utils/lyncsWidget";
import { buildLyncsFlightSearchParams } from "../../../utils/lyncsFlightParams";

const BookFlightDrawer = ({ open, onClose, training }) => {
  const [loaded, setLoaded] = useState(false);
  const { userData } = useCurrentUser();
  const { data: profile } = useGetProfile({
    user: userData?.data,
    path: "/profile/get_profile",
  });

  const handleClose = () => {
    setLoaded(false);
    onClose?.();
  };

  useEffect(() => {
    if (!open) return;

    const payload = buildLyncsFlightPayload({
      ...profile,
      staff_id: userData?.data?.STAFF_ID,
    });
    const searchParams = buildLyncsFlightSearchParams(training);

    openLyncsFlightWidget({
      data: payload,
      searchParams,
      onReady: () => {
        setLoaded(true);
        handleClose();
      },
      onError: () => {
        setLoaded(true);
        handleClose();
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Drawer
      title={<span className="font-helvetica">Book Flight</span>}
      open={open}
      onClose={handleClose}
      width={1400}
      className="font-helvetica"
      destroyOnClose
    >
      {!loaded && (
        <div className="h-[80vh] flex items-center justify-center">
          <StarLoader size={40} />
        </div>
      )}
    </Drawer>
  );
};

BookFlightDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  training: PropTypes.object,
};

export default BookFlightDrawer;
