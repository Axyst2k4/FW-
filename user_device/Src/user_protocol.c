#include "user_protocol.h"

#include "stm32_mem.h"
#include "sys_app.h"

#include "user_lora.h"
#include "user_define.h"
#include "user_time.h"
#include "user_payload.h"
#include "radio.h"

/* External variables ---------------------------------------------------------*/
StructControlLora        sCtrlLora =
{
	.CtrlACK_u8 = FALSE,
};
/* Exported functions --------------------------------------------------------*/
uint8_t Protocol_Extract_Rx (uint8_t *pData, uint8_t Length, uint8_t NoProcess, LoRaFrame_t *sFrameRx)
{
    uint8_t 	Result = FALSE;
    uint32_t 	DevAddrRx = 0;
    uint32_t 	NetAddrRx = 0;
    uint8_t 	i = 0;

    LOG_Array(LOG_RECEI, pData, Length, "");

    //Frame Header
    sFrameRx->Header.Value 	= 	*(pData);

    DevAddrRx = DevAddrRx << 8 | *(pData + 1);
    DevAddrRx = DevAddrRx << 8 | *(pData + 2);
    DevAddrRx = DevAddrRx << 8 | *(pData + 3);
    DevAddrRx = DevAddrRx << 8 | *(pData + 4);

    sFrameRx->DevAddr = DevAddrRx;
    NetAddrRx = NetAddrRx << 8 | *(pData + 5);
    NetAddrRx = NetAddrRx << 8 | *(pData + 6);
    NetAddrRx = NetAddrRx << 8 | *(pData + 7);
    NetAddrRx = NetAddrRx << 8 | *(pData + 8);

    sFrameRx->NetAddr = NetAddrRx;

	#ifdef DEVICE_TYPE_STATION
		for (i = 0; i < 4; i++)
		{
			if ( *(pData + 5 + i) != *(sModem.sNET_id.Data_a8 + i))
			{
				return FALSE;
			}
		}

		if (sFrameRx->Header.Bits.RespondType_u8 == DATA_CONFIRMED_UP)
		{
			sCtrlLora.CtrlACK_u8 = TRUE;
			Result = TRUE;
		}

		if (Length > 9)
		{
			Protocol_Process_Rx (sFrameRx->Header.Bits.DataType_u8, pData + 9, Length - 9);
		}
	#else
		if (sFrameRx->Header.Bits.SendAll == 0){
			for (i = 0; i < 4; i++){
				if ( *(pData + 1 + i) != *(sModem.sDCU_id.Data_a8 + i))
				{
					return FALSE;
				}
			}
			for (i = 0; i < 4; i++){
				if ( *(pData + 5 + i) != *(sModem.sNET_id.Data_a8 + i))
				{
					return FALSE;
				}
			}
		}
		// Check ACK answer
		if (sFrameRx->Header.Bits.RespondType_u8 == DATA_CONFIRMED_DOWN )
		{
			sCtrlLora.CtrlACK_u8 = TRUE;
			Result = TRUE;
		}
		// Extract
		if (Length > 9)
		{
			Protocol_Process_Rx (sFrameRx->Header.Bits.DataType_u8, pData + 9, Length - 9);
		}
	#endif
    return Result;
}

uint8_t Protocol_Process_Rx (uint8_t DataType, uint8_t *pData, uint8_t Length)
{
	#ifdef DEVICE_TYPE_STATION
		uint16_t 	i = 0;
    	switch(DataType)
    	{
    		case _DATA_SINGLE:
    			LOG(LOG_RECEI, "Single shot NodeID: %d%d", pData[4]-0x30, pData[5]-0x30);
				USER_Payload_Station_RTC(0);
				Reset_Buff(&sLoraVar.sIntanData);
				for ( i = 0; i < (Length - 1); i++)
					*(sLoraVar.sIntanData.Data_a8 + sLoraVar.sIntanData.Length_u16++) = *(pData + i);
				HAL_UART_Transmit(&uart_mcu, sLoraVar.sIntanData.Data_a8, sLoraVar.sIntanData.Length_u16 , 1000);
				break;
    		case _DATA_MULTI:
    			LOG(LOG_RECEI, "Calib shot NodeID: %d%d", pData[4]-0x30, pData[5]-0x30);
				USER_Payload_Station_Confirm(0);
				Reset_Buff(&sLoraVar.sIntanData);
				for ( i = 0; i < (Length - 1); i++)
					*(sLoraVar.sIntanData.Data_a8 + sLoraVar.sIntanData.Length_u16++) = *(pData + i);
				HAL_UART_Transmit(&uart_mcu, sLoraVar.sIntanData.Data_a8, sLoraVar.sIntanData.Length_u16 , 1000);
				break;
    		case _DATA_MODE:
    			LOG(LOG_RECEI, "Mode shot NodeID: %d%d, Mode: %d", pData[4]-0x30, pData[5]-0x30, pData[8]);
				USER_Payload_Station_Confirm(0);
				Reset_Buff(&sLoraVar.sIntanData);
				for ( i = 0; i < (Length - 1); i++)
					*(sLoraVar.sIntanData.Data_a8 + sLoraVar.sIntanData.Length_u16++) = *(pData + i);
				HAL_UART_Transmit(&uart_mcu, sLoraVar.sIntanData.Data_a8, sLoraVar.sIntanData.Length_u16 , 1000);
				break;
    		case _DATA_JOIN:
    			LOG(LOG_RECEI, "Join shot NodeID: %d%d", pData[4]-0x30, pData[5]-0x30);
    			USER_Payload_Station_Accept(0);
				Reset_Buff(&sLoraVar.sIntanData);
				for ( i = 0; i < (Length - 1); i++)
					*(sLoraVar.sIntanData.Data_a8 + sLoraVar.sIntanData.Length_u16++) = *(pData + i);
				HAL_UART_Transmit(&uart_mcu, sLoraVar.sIntanData.Data_a8, sLoraVar.sIntanData.Length_u16 , 1000);
				break;
    		case _DATA_CONFIRM:
	            Radio.Rx(RX_TIMEOUT_VALUE);
    			break;
    		case _DATA_NONE:
    			break;
    		default:
    			break;
    	}
	#else
        uint8_t 	Obis = 0;
        uint8_t 	Pos = 0;
        uint8_t 	length_data = 0;
	    switch(DataType)
	    {
	    	case _DATA_RTC:
			    USER_Payload_Node_Confirm(0);
				break;
	       	case _DATA_MODE:
				while (Pos < (Length - 1))  //bo crc
				{
					Obis = *(pData + Pos++);
					switch (Obis)
					{
						case OBIS_ID_STATION:
							length_data = *(pData + Pos++);
							Pos++;
							Pos++;
							Pos++;
							Pos++;
							break;
						case OBIS_MODE:
							length_data = *(pData + Pos++);
							sModem.Mode = *(pData + Pos++);
							break;
						default:
							break;
					}
				}
				switch(sModem.Mode)
				{
					case _MODE_SLEEP:
						LED_OFF(__LED_MODE);
						USER_Payload_Node_Mode(sModem.TimeDelaySingle_u32);
						UTIL_TIMER_Stop (&TimerLoraTx);
						UTIL_TIMER_Start (&TimerLoraTx);
						break;
					case _MODE_WAKEUP:
						LED_ON(__LED_MODE);
						UTIL_TIMER_Stop(&TimerLoraTx);
						USER_Payload_Node_Mode(sModem.TimeDelaySingle_u32);
						break;
					case _MODE_MEASURE:
						LED_ON(__LED_MODE);
						USER_Payload_Node_Calib(sModem.TimeDelayCalib_u32);
						LED_OFF(__LED_MODE);
						UTIL_TIMER_Stop (&TimerLoraTx);
						UTIL_TIMER_Start (&TimerLoraTx);
						break;
					default:
						break;
				}
				break;
	       	case _DATA_CONFIRM:
	       		Radio.Rx(RX_TIMEOUT_VALUE_ACTIVE);
	       		break;
	       	case _DATA_ACCEPT:
	       		break;
	    	case _DATA_NONE:
	    		break;
	    	default:
	    		break;
		}
	#endif
    return 1;
}

uint8_t Protocol_Packet_Header (LoRaFrame_t *pFrame, uint8_t RespondType, uint8_t DataType)
{
	pFrame->Header.Bits.RespondType_u8 = RespondType;
	pFrame->Header.Bits.DataType_u8 = DataType;
	pFrame->Header.Bits.ACK_u8 = sCtrlLora.CtrlACK_u8;

	#ifdef DEVICE_TYPE_STATION
		if (sModem.SendAll == 1)
		{
			pFrame->Header.Bits.SendAll = 1;
		} else {
			pFrame->Header.Bits.SendAll = 0;
		}
	#else
		pFrame->Header.Bits.SendAll = 0;
	#endif

	#ifdef DEVICE_TYPE_STATION
		pFrame->DevAddr = sLoraVar.sFrameRx.DevAddr;
		uint32_t NETID_u32 = 0;
		uint8_t i = 0;

		for (i = 0; i < 4; i++)
		{
			NETID_u32 = (NETID_u32 << 8) + *(sModem.sNET_id.Data_a8 + i);
		}
		pFrame->NetAddr = NETID_u32;
	#else
		uint32_t DCUID_u32 = 0;
		uint32_t NETID_u32 = 0;
		uint8_t i = 0;

		for (i = 0; i < 4; i++)
		{
			DCUID_u32 = (DCUID_u32 << 8) + *(sModem.sDCU_id.Data_a8 + i);
			NETID_u32 = (NETID_u32 << 8) + *(sModem.sNET_id.Data_a8 + i);
		}

		pFrame->DevAddr = DCUID_u32;
		pFrame->NetAddr = NETID_u32;
	#endif

	sCtrlLora.CtrlACK_u8 = 0;

    if (pFrame->Header.Bits.ACK_u8 != 0)
    {
        return 1;
    }
    return 0;
}
