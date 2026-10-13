/**
 * Drawer to view training reviews/feedback for a course.
 * Read-only: shows staff review records in a searchable table.
 */
import { Drawer, Spin, Button, ConfigProvider, Table, Input } from "antd";
import PropTypes from "prop-types";
import { BiExpandAlt } from "react-icons/bi";
import { useMemo, useState } from "react";
import TrainingFeedback from "../templates/TrainingFeedback";

function formatName(review) {
  const parts = [
    review.LAST_NAME,
    review.FIRST_NAME,
    review.OTHER_NAMES,
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : "Unknown staff";
}

function getCertificateUrl(review) {
  const raw = review?.REPORT_URL;
  ("");

  if (!raw) return "";
  if (typeof raw === "string" && raw.startsWith("http")) return raw;
  return raw;
}

function TrainingReviewListDrawer({
  open,
  onClose,
  trainingTitle,
  reviews = [],
  loading,
  training = null,
}) {
  const [openFullReview, setOpenFullReview] = useState({
    state: false,
    review: null,
    training: null,
  });
  const [searchValue, setSearchValue] = useState("");
  const hasReviews = Array.isArray(reviews) && reviews.length > 0;

  const filteredReviews = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return reviews;

    return reviews.filter((review) => {
      const staffName = formatName(review).toLowerCase();
      const staffNumber = String(review?.STAFF_NUMBER || "").toLowerCase();
      const totalScore = String(review?.TOTAL_SCORE || "").toLowerCase();
      return (
        staffName.includes(query) ||
        staffNumber.includes(query) ||
        totalScore.includes(query)
      );
    });
  }, [reviews, searchValue]);

  const closeFullReview = () => {
    setOpenFullReview({ state: false, review: null });
  };

  const columns = [
    {
      title: <p className="font-helvetica">Staff Name</p>,
      dataIndex: "staffName",
      key: "staffName",
      sorter: (a, b) => a.staffName.localeCompare(b.staffName),
      render: (value) => (
        <span className="font-medium text-slate-800 font-helvetica capitalize opacity-80">
          {String(value)?.toLowerCase()}
        </span>
      ),
    },
    {
      title: <p className="font-helvetica">Staff Number</p>,
      dataIndex: "staffNumber",
      key: "staffNumber",
      // sorter: (a, b) => a.staffNumber.localeCompare(b.staffNumber),
      render: (value) => (
        <span className="text-slate-700 font-helvetica opacity-80">
          {value || "N/A"}
        </span>
      ),
    },
    {
      title: <p className="font-helvetica">Course Score</p>,
      dataIndex: "totalScore",
      key: "totalScore",
      width: 180,
      sorter: (a, b) => Number(a.totalScore || 0) - Number(b.totalScore || 0),
      render: (value) => (
        <span className="inline-flex items-center rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">
          {value || "—"}
        </span>
      ),
    },
    {
      title: <p className="font-helvetica">Course Certificate</p>,
      dataIndex: "certificate",
      key: "certificate",
      width: 180,
      render: (value, record) =>
        value ? (
          <a
            href={record.REPORT_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 font-helvetica hover:bg-cyan-100"
          >
            View Certificate
          </a>
        ) : (
          <span className="inline-flex items-center rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 font-helvetica opacity-80">
            —
          </span>
        ),
    },
    {
      title: <p className="font-helvetica">Action</p>,
      key: "action",
      width: 160,
      align: "center",
      render: (_, record) => (
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#00bcc2",
            },
          }}
        >
          <Button
            size="small"
            type="primary"
            className="text-xs font-helvetica"
            onClick={() =>
              setOpenFullReview({
                state: true,
                review: record.review,
                training: training,
              })
            }
          >
            <BiExpandAlt size={16} />
            Full Review
          </Button>
        </ConfigProvider>
      ),
    },
  ];

  const dataSource = filteredReviews.map((review) => ({
    key: review.TRAINING_MEMBER_ID ?? review.STAFF_ID ?? formatName(review),
    staffName: formatName(review),
    staffNumber: review?.STAFF_NUMBER || "N/A",
    totalScore: review?.TOTAL_SCORE || "—",
    certificate: review?.IS_CERTIFICATE_UPLOADED,
    certificateUrl: getCertificateUrl(review),
    review,
  }));

  return (
    <>
      <Drawer
        title={null}
        open={open}
        onClose={onClose}
        width={1100}
        className="font-helvetica training-review-list-drawer"
        classNames={{
          body: "bg-gray-50",
          header: "bg-white border-b border-gray-200 hidden",
        }}
        styles={{ body: { paddingTop: 24, paddingBottom: 24 } }}
      >
        <div className="min-h-[240px]">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1 font-helvetica">
              {trainingTitle}
            </h2>
            {/* {trainingTitle && (
              <p className="text-gray-500 text-sm m-0 font-helvetica">
                {trainingTitle}
              </p>
            )} */}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Spin size="large" />
              <span className="text-gray-500 font-helvetica">
                Loading reviews...
              </span>
            </div>
          ) : !hasReviews ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500 m-0 font-helvetica">
                No reviews have been submitted for this training yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                  <Input.Search
                    allowClear
                    placeholder="Search by staff name, staff number, or score"
                    className="w-full md:w-[420px] font-helvetica"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                  />
                  <span className="text-sm text-slate-500 font-helvetica">
                    {filteredReviews.length} of {reviews.length} review(s)
                  </span>
                </div>

                <Table
                  rowClassName={(_, index) =>
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/70"
                  }
                  columns={columns}
                  dataSource={dataSource}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50", "100"],
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} of ${total} reviews`,
                  }}
                  scroll={{ x: 760 }}
                  className="training-review-table"
                />
              </div>
            </div>
          )}
        </div>
      </Drawer>

      <Drawer
        title={null}
        open={openFullReview.state}
        onClose={closeFullReview}
        width={1000}
        className="font-helvetica training-review-list-drawer"
        classNames={{
          body: "bg-gray-50",
          header: "bg-white border-b border-gray-200 hidden",
        }}
      >
        <TrainingFeedback review={openFullReview.review} training={training} />
      </Drawer>
    </>
  );
}

TrainingReviewListDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  trainingTitle: PropTypes.string,
  reviews: PropTypes.array,
  loading: PropTypes.bool,
};

export default TrainingReviewListDrawer;
