/* This example requires Tailwind CSS v2.0+ */
import { FC, Fragment, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  BookingStatusBackEnd,
  CarTypeEnumBackEnd,
  PaymentBackEnd,
} from "../../../common/enumConstants";
import Loading from "../../../components/Loading";
import {
  useBookingDetailQuery,
  useBookingFeedbackMutation,
} from "../../../graphql/generated/schema";
import { getApolloErrorMessage } from "../../../utils/getApolloErrorMessage";

type RowProps = {
  title: string;
  value: string | number;
};

const InforRow: FC<RowProps> = ({ title, value }) => {
  return (
    <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">{title}</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
        {value}
      </dd>
    </div>
  );
};
type Props = {};
export const AdminBookingDetail: FC<Props> = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [feedbackState, setFeedbackState] = useState<{
    text: string;
    star: number;
  }>({ star: 5, text: "" });
  const { data, loading } = useBookingDetailQuery({
    variables: {
      input: {
        bookingId: params.id!,
      },
    },
    onCompleted(data) {
      const { getBookingDetail } = data;
      if (getBookingDetail.error) {
        toast.error(getBookingDetail.error.message);
        navigate("/notfound");
      }
    },
    onError(err) {
      const msg = getApolloErrorMessage(err);
      if (msg) {
        toast.error(msg);
      } else {
        toast.error("Lỗi xảy ra, thử lại sau");
      }
      navigate("/");
    },
  });
  const booking = data?.getBookingDetail.booking;
  const [feedback, { loading: feedbackLoading }] = useBookingFeedbackMutation({
    onCompleted(data) {
      const { bookingFeedback } = data;
      if (bookingFeedback.error) {
        toast.error(bookingFeedback.error.message);
        return;
      }
      if (bookingFeedback.ok) toast.success("Đã gửi phản hồi");
    },
    onError(err) {
      const msg = getApolloErrorMessage(err);
      if (msg) {
        toast.error(msg);
        return;
      }
      toast.error("Lỗi xảy ra, thử lại sau");
    },
  });
  const sendFeedBack = () => {
    if (!booking) return;
    feedback({
      variables: {
        input: {
          id: booking.id,
          rating: feedbackState.star,
          feedback: feedbackState.text,
        },
      },
    });
  };
  return (
    <Fragment>
      {loading && <Loading />}
      {!loading && booking && (
        <div className="w-full px-6">
          <div className="w-full mx-auto px-2 py-3 sm:p-6 bg-white rounded-md shadow-md my-12">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Chi tiết đơn thuê
              </h3>
            </div>
            <div className="mt-5 border-t border-gray-200">
              <dl className="divide-y divide-gray-200">
                <InforRow title={"Họ tên"} value={booking.customerName} />
                <InforRow
                  title={"Số điện thoại"}
                  value={booking.customerPhone}
                />
                <InforRow title={"Mã đơn thuê"} value={booking.bookingCode} />
                <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">
                    {"Trạng thái"}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex flex-col">
                    <h1>{BookingStatusBackEnd[booking.status]}</h1>
                  </dd>
                </div>
                <InforRow
                  title={"Địa chỉ nhận xe"}
                  value={booking.homeDelivery}
                />
                <InforRow
                  title="Thời gian"
                  value={`${new Date(booking.startDate).toLocaleDateString(
                    "vn",
                    {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )} đến ${new Date(booking.endDate).toLocaleDateString("vi", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`}
                />
                {booking.services && booking.services.length > 0 && (
                  <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">
                      Dịch vụ kèm theo
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {booking.services.map((e, i) => (
                        <div key={i} className="">
                          <div>
                            {e.serviceName} ({e.servicePrice}đ{" "}
                            {e.perDay ? "theo ngày" : "theo xe"})
                          </div>
                        </div>
                      ))}
                    </dd>
                  </div>
                )}
                <InforRow title={"Số lượng"} value={booking.quantity} />
                <InforRow
                  title={"Loại xe"}
                  value={CarTypeEnumBackEnd[booking.carType.carType]}
                />
                <InforRow
                  title={"Thanh toán"}
                  value={PaymentBackEnd[booking.payment]}
                />
                <InforRow
                  title={"Tổng tiền"}
                  value={`${booking.totalPrice}đ`}
                />
              </dl>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  );
};
