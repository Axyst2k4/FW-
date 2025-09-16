#include "user_event_drive.h"

#include "gpio.h"

/* Exported functions --------------------------------------------------------*/
/**
 * @brief	Active 1 event len
 * @note	Cho event thuc hien luon
 */
uint8_t fevent_active(sEvent_struct *event_struct, uint8_t event_name)
{
	event_struct[event_name].e_status = 1;
	event_struct[event_name].e_systick = 0;
	return 1;
}

/**
 * @brief	Enable 1 event len
 * @note	Cho phep mot event kich hoat sau period cua no
 */
uint8_t fevent_enable(sEvent_struct *event_struct, uint8_t event_name)
{
	event_struct[event_name].e_status = 1;
	event_struct[event_name].e_systick = HAL_GetTick();
	return 1;
}

/**
 * @brief	Disable 1 event
 */
uint8_t fevent_disable(sEvent_struct *event_struct, uint8_t event_name)
{
	event_struct[event_name].e_status = 0;
	return 1;
}

/* End of file ----------------------------------------------------------------*/
