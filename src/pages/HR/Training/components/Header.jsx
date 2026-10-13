// import { Button } from "@nextui-org/react";
import { Button } from "antd";
import PropTypes from "prop-types";
import { Fragment } from "react";
import {
  IoIosArrowForward,
  IoMdAddCircle,
  // IoMdAddCircle
} from "react-icons/io";
// import './leave.css'
// import { BreadcrumbItem, Breadcrumbs } from "@nextui-org/react";

// eslint-disable-next-line no-unused-vars
export default function Header({ addNew, courseOnly }) {
  return (
    <Fragment>
      <section>
        <div className="flex justify-between items-center">
          <div className="text-center">
            <h2 className="font-helvetica font-bold text-3xl">
              {courseOnly ? "Course" : "Course Notification"}
            </h2>
            <div>
              <span className="text-gray-400 uppercase text-xs flex items-center gap-1 font-helvetica">
                HRMS <IoIosArrowForward className="text-md" /> Course
              </span>
            </div>
          </div>
          <Button
            className="bg-[#00BCC2] hover:bg-[#00979C] transition-all rounded-[4px] text-white font-medium px-4 py-2 font-helvetica flex items-center gap-1 shadow"
            onClick={addNew}
          >
            <IoMdAddCircle size={18} />
            <span>{!courseOnly ? "Create Notification" : "Create Course"}</span>
          </Button>
        </div>
      </section>
    </Fragment>
  );
}

Header.propTypes = {
  addNew: PropTypes.func,
  courseOnly: PropTypes.bool,
};
