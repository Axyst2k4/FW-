#include "user_lora.h"

#include "platform.h"
#include "sys_app.h"
#include "radio.h"
#include "app_version.h"
#include "user_payload.h"
#include "stm32_seq.h"
#include "utilities_def.h"
#include "user_time.h"
#include "user_timer.h"

/* Private define ------------------------------------------------------------*/
#define MAX_APP_BUFFER_SIZE          255
/* wait for remote to be in Rx, before sending a Tx frame*/
#define RX_TIME_MARGIN               50
/* Afc bandwidth in Hz */
#define FSK_AFC_BANDWIDTH            83333

/* Private functions definition -----------------------------------------------*/
static void OnTxDone(void);
static void OnRxDone(uint8_t *payload, uint16_t size, int16_t rssi, int8_t LoraSnr_FskCfo);
static void OnTxTimeout(void);
static void OnRxTimeout(void);
static void OnRxError(void);

static uint8_t 	_Cb_Lora_Tx (uint8_t event);
static uint8_t 	_Cb_Lora_IRQ (uint8_t event);
static uint8_t 	_Cb_Lora_Led (uint8_t event);
/* Private variables ---------------------------------------------------------*/
static RadioEvents_t 	RadioEvents;
static States_t 		State = RX;
static uint8_t 			BufferRx[MAX_APP_BUFFER_SIZE];
static uint16_t 		RxBufferSize = 0;

static uint8_t 			aLORA_TX[MAX_APP_BUFFER_SIZE];
uint8_t 				aINTAN_DATA[MAX_APP_BUFFER_SIZE];

StructLoraManager    sLoraVar =
{
    .sRecv = {&BufferRx[0], 0},
    .sIntanData = {&aINTAN_DATA[0], 0},
};

static UTIL_TIMER_Object_t TimerSend;
static void _Cb_Timer_Send_Event(void *context);

static UTIL_TIMER_Object_t TimerLoraTxAgain;
static void _Cb_Timer_Lora_Tx_Again(void *context);

StructLoraHandle  shLora;

sEvent_struct sEventAppLora[] =
{
	{ _EVENT_LORA_TX, 		    0, 0, 100, 	    _Cb_Lora_Tx },
    { _EVENT_LORA_IRQ, 		    0, 0, 0, 	    _Cb_Lora_IRQ },
	{ _EVENT_LORA_LED, 			1, 0, 500, 	    _Cb_Lora_Led },
};

/* Exported functions ---------------------------------------------------------*/
void AppLora_Init(void)
{
    uint32_t random_delay;
    /* Print APP version*/
//    APP_LOG(TS_OFF, VLEVEL_L, "user_lora.c: LORA_VERSION= V%X.%X.%X\r\n",
//            (uint8_t)(__APP_VERSION >> __APP_VERSION_MAIN_SHIFT),
//            (uint8_t)(__APP_VERSION >> __APP_VERSION_SUB1_SHIFT),
//            (uint8_t)(__APP_VERSION >> __APP_VERSION_SUB2_SHIFT));

    /* Radio initialization */
    RadioEvents.TxDone = 	OnTxDone;
    RadioEvents.RxDone = 	OnRxDone;
    RadioEvents.TxTimeout = OnTxTimeout;
    RadioEvents.RxTimeout = OnRxTimeout;
    RadioEvents.RxError = 	OnRxError;

    Radio.Init(&RadioEvents);

    /*calculate random delay for synchronization*/
    random_delay = (Radio.Random()) >> 22; /*10bits random e.g. from 0 to 1023 ms*/
    random_delay++;
    /* Radio Set frequency */
    Radio.SetChannel(RF_FREQUENCY);

    /* Radio configuration */
	#if ((USE_MODEM_LORA == 1) && (USE_MODEM_FSK == 0))
		Radio.SetTxConfig(MODEM_LORA, TX_OUTPUT_POWER, 0, LORA_BANDWIDTH,
						  LORA_SPREADING_FACTOR, LORA_CODINGRATE,
						  LORA_PREAMBLE_LENGTH, LORA_FIX_LENGTH_PAYLOAD_ON,
						  true, 0, 0, LORA_IQ_INVERSION_ON, TX_TIMEOUT_VALUE);

		Radio.SetRxConfig(MODEM_LORA, LORA_BANDWIDTH, LORA_SPREADING_FACTOR,
						  LORA_CODINGRATE, 0, LORA_PREAMBLE_LENGTH,
						  LORA_SYMBOL_TIMEOUT, LORA_FIX_LENGTH_PAYLOAD_ON,
						  0, true, 0, 0, LORA_IQ_INVERSION_ON, true);

		Radio.SetMaxPayloadLength(MODEM_LORA, MAX_APP_BUFFER_SIZE);

	#elif ((USE_MODEM_LORA == 0) && (USE_MODEM_FSK == 1))
		Radio.SetTxConfig(MODEM_FSK, TX_OUTPUT_POWER, FSK_FDEV, 0,
						  FSK_DATARATE, 0,
						  FSK_PREAMBLE_LENGTH, FSK_FIX_LENGTH_PAYLOAD_ON,
						  true, 0, 0, 0, TX_TIMEOUT_VALUE);

		Radio.SetRxConfig(MODEM_FSK, FSK_BANDWIDTH, FSK_DATARATE,
						  0, FSK_AFC_BANDWIDTH, FSK_PREAMBLE_LENGTH,
						  0, FSK_FIX_LENGTH_PAYLOAD_ON, 0, true,
						  0, 0, false, true);

		Radio.SetMaxPayloadLength(MODEM_FSK, MAX_APP_BUFFER_SIZE);

	#else
		#error "Please define a modulation in the subghz_phy_app.h file."
	#endif /* USE_MODEM_LORA | USE_MODEM_FSK */

	UTIL_TIMER_Create(&TimerSend, 0xFFFFFFFFU, UTIL_TIMER_ONESHOT, _Cb_Timer_Send_Event, NULL);
    UTIL_TIMER_Create(&TimerLoraTxAgain, 0xFFFFFFFFU, UTIL_TIMER_ONESHOT, _Cb_Timer_Lora_Tx_Again, NULL);

	#ifdef DEVICE_TYPE_STATION
    	Radio.Rx(RX_TIMEOUT_VALUE);
	#else
	#endif
}

uint8_t AppLora_Send (uint8_t *pData, uint8_t Length, uint8_t RespondType, uint8_t DataType, uint32_t delay)
{
    uint8_t i = 0;
    uint8_t CheckACKRequest = 0;
    sData   sMessTx = {&aLORA_TX[0], 0};
    LoRaFrame_t sFrameMess;

    if (Length != 0) // Co payload
    {
        CheckACKRequest = Protocol_Packet_Header(&sFrameMess, RespondType, DataType);
    } else
    {
        CheckACKRequest = Protocol_Packet_Header(&sFrameMess, RespondType, _DATA_NONE);
    }

    if ( (Length != 0) || (CheckACKRequest == TRUE) )
    {
        UTIL_MEM_set( aLORA_TX, 0, sizeof(aLORA_TX) );

        *(sMessTx.Data_a8 + sMessTx.Length_u16++) = sFrameMess.Header.Value;

        *(sMessTx.Data_a8 + sMessTx.Length_u16++) = (uint8_t) (sFrameMess.DevAddr >> 24);
        *(sMessTx.Data_a8 + sMessTx.Length_u16++) = (uint8_t) (sFrameMess.DevAddr >> 16);
        *(sMessTx.Data_a8 + sMessTx.Length_u16++) = (uint8_t) (sFrameMess.DevAddr >> 8);
        *(sMessTx.Data_a8 + sMessTx.Length_u16++) = (uint8_t) sFrameMess.DevAddr;

        *(sMessTx.Data_a8 + sMessTx.Length_u16++) = (uint8_t) (sFrameMess.NetAddr >> 24);
        *(sMessTx.Data_a8 + sMessTx.Length_u16++) = (uint8_t) (sFrameMess.NetAddr >> 16);
        *(sMessTx.Data_a8 + sMessTx.Length_u16++) = (uint8_t) (sFrameMess.NetAddr >> 8);
        *(sMessTx.Data_a8 + sMessTx.Length_u16++) = (uint8_t) sFrameMess.NetAddr;

        for (i = 0; i < Length; i++)
        {
            if (sMessTx.Length_u16 >= sizeof(aLORA_TX) )
                break;
            *(sMessTx.Data_a8 + sMessTx.Length_u16++) = *(pData + i);
        }
        for (i = 0; i < sMessTx.Length_u16; i++)
        {
        	*(sModem.sBackup.Data_a8 + i) = *(sMessTx.Data_a8 + i);
        }
        sModem.sBackup.Length_u16 = sMessTx.Length_u16;

    	LED_ON(__LED_MEASURE);
        if (delay != 0)
        {
        	UTIL_TIMER_SetPeriod(&TimerSend, delay);
        	UTIL_TIMER_Start(&TimerSend);
        } else {
        	Radio.Send(sMessTx.Data_a8, sMessTx.Length_u16);
            LED_OFF(__LED_MEASURE);
        }
        return 1;
    }
    return 0;
}

uint8_t AppLora_Task(void)
{
	uint8_t i = 0;
	uint8_t Result = 0;

	for (i = 0; i < _EVENT_LORA_END; i++)
	{
		if (sEventAppLora[i].e_status == 1)
		{
			if ((sEventAppLora[i].e_systick == 0) ||
					((HAL_GetTick() - sEventAppLora[i].e_systick)  >=  sEventAppLora[i].e_period))
			{
                sEventAppLora[i].e_status = 0;
				sEventAppLora[i].e_systick = HAL_GetTick();
				sEventAppLora[i].e_function_handler(i);
			}
		}
	}
	return Result;
}

void AppLora_Deinit_IO_Radio (void)
{
    Sx_Board_IoDeInit();
}

void AppLora_Init_IO_Radio (void)
{
    Sx_Board_IoInit();
}

/* Private functions ---------------------------------------------------------*/
static void OnTxDone(void)
{
    Radio.Sleep();
    State = TX;
    fevent_active(sEventAppLora, _EVENT_LORA_IRQ);
}

static void OnRxDone(uint8_t *payload, uint16_t size, int16_t rssi, int8_t LoraSnr_FskCfo)
{
    Radio.Sleep();
    State = RX;
    memset(BufferRx, 0, MAX_APP_BUFFER_SIZE);
    RxBufferSize = size;
    if (RxBufferSize <= MAX_APP_BUFFER_SIZE)
    {
        memcpy(BufferRx, payload, RxBufferSize);
    }
    sLoraVar.Snr_u8 = LoraSnr_FskCfo;
    sLoraVar.Rssi_u8 = rssi;
    LOG(LOG_INFOR, "Rssi: %ddB, Snr: %ddBm", sLoraVar.Snr_u8, sLoraVar.Rssi_u8);
    fevent_active(sEventAppLora, _EVENT_LORA_IRQ);
}

static void OnTxTimeout(void)
{
    Radio.Sleep();
    State = TX_TIMEOUT;
    fevent_active(sEventAppLora, _EVENT_LORA_IRQ);
}

static void OnRxTimeout(void)
{
    Radio.Sleep();
    State = RX_TIMEOUT;
    fevent_active(sEventAppLora, _EVENT_LORA_IRQ);
}

static void OnRxError(void)
{
    Radio.Sleep();
    State = RX_ERROR;
    fevent_active(sEventAppLora, _EVENT_LORA_IRQ);
}

/* Private functions ---------------------------------------------------------*/
static uint8_t _Cb_Lora_IRQ (uint8_t event)
{
    Radio.Sleep();
    switch (State)
    {
        case RX:
			#ifdef DEVICE_TYPE_STATION
	        	LOG(LOG_DEBUG, "OnRxDone");
	        	if (Protocol_Extract_Rx(BufferRx, RxBufferSize, 0, &sLoraVar.sFrameRx) != TRUE)
				{
		            Radio.Rx(RX_TIMEOUT_VALUE);
				}
			#else
	        	LOG(LOG_DEBUG, "OnRxDone");
	        	if (Protocol_Extract_Rx(BufferRx, RxBufferSize, 0, &sLoraVar.sFrameRx) != TRUE)
				{
		            Radio.Rx(RX_TIMEOUT_VALUE_ACTIVE);
				}
			#endif
            break;
        case TX:
        	LOG(LOG_DEBUG, "OnTxDone");
        	sModem.RxTimeBefore = SysTimeGet();
			#ifdef DEVICE_TYPE_STATION
				Radio.Rx(RX_TIMEOUT_VALUE);
			#else
				if(sModem.bNeedConfirm == DATA_CONFIRMED_UP)
				{
					LOG(LOG_DEBUG, "RX_TIMEOUT_VALUE");
					Radio.Rx(RX_TIMEOUT_VALUE);
				} else {
					LOG(LOG_DEBUG, "RX_TIMEOUT_VALUE_ACTIVE");
					Radio.Rx(RX_TIMEOUT_VALUE_ACTIVE);
				}
				sModem.bNeedConfirm = DATA_UNCONFIRMED_UP;
				sModem.TypeDataMessage = _DATA_NONE;
				sModem.TimeTrySendAgain = 0;
				Reset_Buff(&sModem.sBackup);
			#endif
            break;
        case TX_TIMEOUT:
        	LOG(LOG_DEBUG, "OnTxTimeOut");
            break;
        case RX_TIMEOUT:
        	LOG(LOG_DEBUG, "OnRxTimeOut");
			#ifdef DEVICE_TYPE_STATION
				if (sModem.bNeedConfirm == DATA_CONFIRMED_DOWN)
				{
					LOG(LOG_INFOR, "Time retry: %d", sModem.TimeTrySendAgain);
					if (sModem.TimeTrySendAgain < 2)
					{
						Radio.Send(sModem.sBackup.Data_a8, sModem.sBackup.Length_u16);
						LED_OFF(__LED_MEASURE);
						sModem.TimeTrySendAgain++;
					} else
					{
						sModem.Mode = 0;
						sModem.bNeedConfirm = DATA_UNCONFIRMED_DOWN;
						sModem.TypeDataMessage = _DATA_NONE;
						sModem.TimeTrySendAgain = 0;
						Reset_Buff(&sModem.sBackup);
//						UTIL_TIMER_Start (&TimerLoraTx);
					}
				} else {
					Radio.Rx(RX_TIMEOUT_VALUE);
					sModem.Mode = 0;
				}
			#else
				if (sModem.bNeedConfirm == DATA_CONFIRMED_UP)
				{
					LOG(LOG_INFOR, "Time retry: %d", sModem.TimeTrySendAgain);
					if (sModem.TimeTrySendAgain < 2)
					{
						Radio.Send(sModem.sBackup.Data_a8, sModem.sBackup.Length_u16);
						LED_OFF(__LED_MEASURE);
						sModem.TimeTrySendAgain++;
					} else
					{
						sModem.Mode = 0;
						sModem.bNeedConfirm = DATA_UNCONFIRMED_UP;
						sModem.TypeDataMessage = _DATA_NONE;
						sModem.TimeTrySendAgain = 0;
						Reset_Buff(&sModem.sBackup);
					}
				} else {
					if(sModem.Mode == _MODE_WAKEUP)
					{
						UTIL_TIMER_Stop (&TimerLoraTx);
						UTIL_TIMER_Start (&TimerLoraTx);
						sModem.Mode = _MODE_SLEEP;
						USER_Payload_Node_Mode(sModem.TimeDelaySingle_u32);
					}
				}
			#endif
			break;
        case RX_ERROR:
        	LOG(LOG_DEBUG, "OnRxError");
			#ifdef DEVICE_TYPE_STATION
				if (sModem.bNeedConfirm == DATA_CONFIRMED_DOWN)
				{
					LOG(LOG_INFOR, "Time retry: %d", sModem.TimeTrySendAgain);
					if (sModem.TimeTrySendAgain < 2)
					{
						Radio.Send(sModem.sBackup.Data_a8, sModem.sBackup.Length_u16);
						LED_OFF(__LED_MEASURE);
						sModem.TimeTrySendAgain++;
					} else
					{
						sModem.Mode = 0;
						sModem.bNeedConfirm = DATA_UNCONFIRMED_DOWN;
						sModem.TypeDataMessage = _DATA_NONE;
						sModem.TimeTrySendAgain = 0;
						Reset_Buff(&sModem.sBackup);
//						UTIL_TIMER_Start (&TimerLoraTx);
					}
				} else {
					Radio.Rx(RX_TIMEOUT_VALUE);
					sModem.Mode = 0;
				}
			#else
				if (sModem.bNeedConfirm == DATA_CONFIRMED_UP)
				{
					LOG(LOG_INFOR, "Time retry: %d", sModem.TimeTrySendAgain);
					if (sModem.TimeTrySendAgain < 2)
					{
						Radio.Send(sModem.sBackup.Data_a8, sModem.sBackup.Length_u16);
						LED_OFF(__LED_MEASURE);
						sModem.TimeTrySendAgain++;
					} else
					{
						sModem.Mode = 0;
						sModem.bNeedConfirm = DATA_UNCONFIRMED_UP;
						sModem.TypeDataMessage = _DATA_NONE;
						sModem.TimeTrySendAgain = 0;
						Reset_Buff(&sModem.sBackup);
					}
				} else {
					if(sModem.Mode == _MODE_WAKEUP)
					{
						UTIL_TIMER_SetPeriod (&TimerLoraTx, sFreqInfor.FreqWakeup_u32 * 1000 - sModem.TimeDelayTx_u32);
						UTIL_TIMER_Stop (&TimerLoraTx);
						UTIL_TIMER_Start (&TimerLoraTx);
						sModem.Mode = _MODE_SLEEP;
						USER_Payload_Node_Mode(sModem.TimeDelaySingle_u32);
					}
				}
			#endif
			break;
        default:
            break;
    }
    return 1;
}
static uint8_t _Cb_Lora_Tx(uint8_t event)
{
    return 1;
}

static uint8_t 	_Cb_Lora_Led (uint8_t event)
{
    return 1;
}

static void _Cb_Timer_Lora_Tx_Again(void *context)
{

}

static void _Cb_Timer_Send_Event(void *context)
{
	Radio.Send(sModem.sBackup.Data_a8, sModem.sBackup.Length_u16);
    LED_OFF(__LED_MEASURE);
}
